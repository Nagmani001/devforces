import axios from "axios";
import util from "util";
const exec = util.promisify(require('child_process').exec);
import fs from "fs";
import path from "path";
import StreamZip from "node-stream-zip";
import { LogsManager } from "./logsManager";

export const WORKER_ROOT = path.resolve(__dirname, '..', '..');

export const WORK_DIR = path.join(WORKER_ROOT, 'work');

export async function downloadAndUnzipFile(url: string, id: string, logsManager?: LogsManager) {
  try {
    if (!fs.existsSync(WORK_DIR)) {
      fs.mkdirSync(WORK_DIR, { recursive: true });
    }

    const zipFilePath = path.join(WORK_DIR, `${id}.zip`);
    const extractedDir = path.join(WORK_DIR, 'extracted');

    if (logsManager) {
      await logsManager.addLog(`Initiating download from S3: ${url}`);
    }

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const contentLength = response.headers['content-length'];
    const fileSizeMB = contentLength ? (parseInt(contentLength) / (1024 * 1024)).toFixed(2) : 'unknown';

    if (logsManager) {
      await logsManager.addLog(`File size: ${fileSizeMB} MB`);
      await logsManager.addLog("Downloading submission archive...");
    }

    const writer = fs.createWriteStream(zipFilePath);

    let downloadedBytes = 0;
    let lastLoggedProgress = -1;

    response.data.on('data', (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      if (contentLength && logsManager) {
        const progressPercent = Math.floor((downloadedBytes / parseInt(contentLength)) * 100);
        if (progressPercent <= 100) {
          lastLoggedProgress = progressPercent;
          logsManager.addLog(`Download progress: ${progressPercent}%`).catch(() => { });
        }
      }
    });

    await new Promise((resolve, reject) => {
      //@ts-ignore
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.pipe(writer);
    });

    if (logsManager) {
      await logsManager.addLog(" Download completed successfully");
      await logsManager.addLog(" Preparing to extract archive...");
    }

    // Check if extracted directory exists, create if not
    if (!fs.existsSync(extractedDir)) {
      fs.mkdirSync(extractedDir, { recursive: true });
      if (logsManager) {
        await logsManager.addLog(" Created extraction directory");
      }
    } else {
      if (logsManager) {
        await logsManager.addLog(" Using existing extraction directory");
      }
    }

    const zip = new StreamZip.async({ file: zipFilePath, skipEntryNameValidation: true });

    if (logsManager) {
      await logsManager.addLog(" Extracting files from archive...");
    }

    const entries = await zip.entries();
    const totalEntries = Object.keys(entries).length;

    if (logsManager && totalEntries > 0) {
      await logsManager.addLog(`   Found ${totalEntries} files/directories in archive`);
    }

    const count = await zip.extract(null, extractedDir);
    await zip.close();

    if (logsManager) {
      await logsManager.addLog(` Successfully extracted ${count} files`);
    }

    const folder = await exec(`cd "${extractedDir}" && ls -d */ 2>/dev/null | head -1 || ls -1 | head -1`);
    const projectName = folder.stdout.trim().replace(/\//g, '');

    if (logsManager && projectName) {
      await logsManager.addLog(` Project identified: ${projectName}`);
    }

    // Return the full absolute path to the project
    return path.join(extractedDir, projectName);

  } catch (err: any) {
    const errorMessage = err?.message || "Unknown error occurred";
    if (logsManager) {
      await logsManager.addLog(`Error during download/extraction: ${errorMessage}`, "error");
    }
    console.log("error occurred in downloadAndUnzipFile", err);
    throw err;
  }
}
