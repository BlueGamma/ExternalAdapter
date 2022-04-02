const http = require("http");
const { exFunction } = require("./service");

const server = http.createServer((req, res) => {
    if (req.method == "POST") {
        let job;
        req.on("data", async (json) => {
            job = await JSON.parse(json);
        }).on("end", async () => {
            const ret = await exFunction(job.data.image, job.data.address, job.data.name)
                                        
            const json = {
                "data": ret
            }
            res.end(JSON.stringify(json));
        });
    } else {
        res.end(JSON.stringify({}));
    }
});

server.listen(5000);
