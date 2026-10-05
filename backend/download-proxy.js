const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("cloud-sql-proxy.exe");
https.get("https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.x64.exe", function(response) {
  response.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log("Download completed");
  });
});
