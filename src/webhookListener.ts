import 'dotenv/config';
import express from "express";
import multer from "multer";
import type { Request, Response } from "express";
import { onLibraryNew } from "./batch"

export function startWebhookListener() {
    const app = express();
    const upload = multer();

    app.post("/plex-webhook", upload.any(), handler);

    const port = Number(process.env.PLEX_PORT) || 8787;
    app.listen(port, () => {console.log(`Starting Listener on http://127.0.0.1:${port}/plex-webhook`);});

    console.log("typeof onLibraryNew =", typeof onLibraryNew);
}

function handler(req: Request, res: Response) {


    const body = req.body as { payload?: string }
    const payload = body.payload;

    
    let data;
    
    if (!payload) {
        console.log("No Payload");
        return res.sendStatus(400);
    }

    try {
        data = JSON.parse(payload);
    } catch (err) {
        console.log("Invalid JSON payload:", err)
        return res.sendStatus(400);
    }

    console.log(data.event);

    if (data.event === "library.new") {
        console.log("Received New Library")
        try {
            onLibraryNew(data.Metadata);
        } catch (e) {
            console.error("onLibraryNew crashed:", e);
        };
    }

    return res.sendStatus(200);

}