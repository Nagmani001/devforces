import axios from "axios";
import fs from "fs";
import StreamZip from "node-stream-zip";

export async function downloadAndUnzipFile(url: string, id: string) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    response.data.pipe(fs.createWriteStream(`/home/nagmani/root/projects/devforces/apps/worker/src/${id}.zip`));

    //WARNING: event driven architecture needed
    await new Promise(r => setTimeout(r, 2000));

    const zip = new StreamZip.async({ file: `/home/nagmani/root/projects/devforces/apps/worker/src/${id}.zip` });

    const count = await zip.extract(null, '/home/nagmani/root/projects/devforces/apps/worker/src/');

    await zip.close();

    console.log("success");
  } catch (err) {
    console.log(err);
    console.log("error occured");
  }
}
