const Moralis = require("moralis/node");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
require("dotenv").config();
let canvas;
let ctx;

const ethers = Moralis.web3Library;

const btoa = (text) => {
    return Buffer.from(text, "binary").toString("base64");
}

const exFunction = async (url, address, name) => {
    // Moralis initiation
    const serverUrl = process.env.serverUrl;
    const appId = process.env.appId;
    const masterKey = process.env.masterKey;
    await Moralis.start({ serverUrl, appId, masterKey});

    // generate the new card image
    await iconCreating(url);
    await CardCreating(name);

    // upload the image and metadata on IPFS and encoding the URL, then return it
    const ipfs = await getURIonIPFS();
    const ipfsVar = ipfs.slice(34); // cut off "https://ipfs.moralis.io:2053/ipfs/"
    const len = ipfsVar.length / 2;
    const byte0 = ethers.utils.formatBytes32String(ipfsVar.slice(0, len));
    const byte1 = ethers.utils.formatBytes32String(ipfsVar.slice(len));
    return { "furi": byte0, "luri": byte1, "name": ethers.utils.formatBytes32String(name) }
}

const canvasInit = async (x, y) => {
    canvas = createCanvas(x, y);
    ctx = canvas.getContext("2d");
}

// ./input/usrIcon.png -> ./output/icon.png
const iconCreating = async (url) => {
    const icon = await loadImage(url);
    const iw = icon.width;
    const ih = icon.height;
    await canvasInit(iw, ih);

    if (iw >= ih) {
        canvas.height = 160;
        canvas.width = 160 * iw / ih;
        ctx.arc( 80 * iw /ih, 80, 75, 0 * Math.PI / 180, 360 * Math.PI / 180 );
        ctx.clip();
        ctx.drawImage(icon, 0, 0, canvas.width, canvas.height);
    } else {
        canvas.height = 160 * ih / iw;
        canvas.width = 160;
        ctx.arc( 80, 80 * iw /ih, 75, 0 * Math.PI / 180, 360 * Math.PI / 180 );
        ctx.clip();
        ctx.drawImage(icon, 0, 0, canvas.width, canvas.height);
    }
    fs.writeFileSync("./output/icon.png", canvas.toBuffer("image/png"));
}

const CardCreating = async (text) => {
    let filepath = "./input/roundrobin.png";
    let iconpath = "./output/icon.png";
    await canvasInit(1000, 1000);
    const background = await loadImage(filepath);
    const icon = await loadImage(iconpath);
    canvas.height = background.height;
    canvas.width = background.width;
    ctx.drawImage(background, 0, 0);
    ctx.font = '32px fantasy';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'center';
    ctx.textAlign = 'center';
    var x = (canvas.width / 2);
    var y = (canvas.height / 2);
    var y = (canvas.height / 2);
    var ix = (icon.width / 2);
    var iy = (icon.height / 2);
    ctx.translate(x, y);
    ctx.rotate(-22 * Math.PI / 180);
    ctx.translate(-x, -y);
    ctx.drawImage(icon, x - ix, y - iy - 40);
    ctx.fillText(text, x, y + 85);
    fs.writeFileSync("./output/magicplank.png", canvas.toBuffer("image/png"));
}

const uploadImage = async(data) => {
    // data from ./output/icon.png
    const base64 = await btoa(fs.readFileSync("./output/magicplank.png"));
    const file = new Moralis.File("magicplank.png", { base64: `data:image/png;base64,${base64}` });
    await file.saveIPFS({ useMasterKey: true });
    console.log("IPFS address of Image: ", file.ipfs());
    return file.ipfs();
}

const getURIonIPFS = async() => {
    const imageURL = await uploadImage();

    const metadata = {
        "name": "DynamicNFT",
        "description": "This is DynamicNFT.",
        "image": imageURL
    }
    
    const file = new Moralis.File("file.json", { base64: btoa(JSON.stringify(metadata)) });
    await file.saveIPFS({ useMasterKey: true });
    console.log("IPFS address of metadata", file.ipfs());
    return file.ipfs();
}

module.exports = {
    exFunction
}