import axios from "axios";
import util from "util";
const exec = util.promisify(require('child_process').exec);
import fs from "fs";
import StreamZip from "node-stream-zip";

export async function downloadAndUnzipFile(url: string, id: string) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(`src/${id}.zip`);
    await response.data.pipe(writer);

    await new Promise((resolve) => {
      //@ts-ignore
      writer.on("finish", resolve)
    })

    fs.mkdirSync('src/extracted');

    const zip = new StreamZip.async({ file: `src/${id}.zip` });
    const count = await zip.extract(null, 'src/extracted/');
    await zip.close();

    const folder = await exec("cd src/extracted/ && ls");

    return `extracted/${folder.stdout.split("\n")[0]}`

  } catch (err) {
    console.log("error occured", err);
  }
}
