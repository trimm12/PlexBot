import { ObjectId } from "mongodb";
import { getDb } from "./db.js";

export type RequestStatus = "pending" | "approved" | "denied" | "added";

export type PlexRequest = {
    _id?: ObjectId;
    title: string;
    requestedBy: string;      // Discord user ID
    requestedByTag: string;   // Discord username, for display
    status: RequestStatus;
    createdAt: Date;
    updatedAt: Date;
    reviewedBy?: string;      // Discord user ID of whoever actioned it
    reason?: string;          // optional note, e.g. why a request was denied
};

const COLLECTION = "requests";

export async function createRequest(title: string, requestedBy: string, requestedByTag: string): Promise<PlexRequest> {
    const db = await getDb();

    const now = new Date();

    const request: PlexRequest = {
        title,
        requestedBy,
        requestedByTag,
        status: "pending",
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection<PlexRequest>(COLLECTION).insertOne(request);
    request._id = result.insertedId;

    return request;
}

export async function getPendingRequests(): Promise<PlexRequest[]> {
    const db = await getDb();

    return db.collection<PlexRequest>(COLLECTION)
        .find({ status: "pending" })
        .sort({ createdAt: 1 })
        .toArray();
}

export async function getRequestById(id: string): Promise<PlexRequest | null> {
    if (!ObjectId.isValid(id)) return null;

    const db = await getDb();

    return db.collection<PlexRequest>(COLLECTION).findOne({ _id: new ObjectId(id) });
}

export async function updateRequestStatus(
    id: string,
    status: RequestStatus,
    reviewedBy: string,
    reason?: string
): Promise<PlexRequest | null> {
    if (!ObjectId.isValid(id)) return null;

    const db = await getDb();

    const setFields: Partial<PlexRequest> = { status, reviewedBy, updatedAt: new Date() };
    if (reason) setFields.reason = reason;

    const result = await db.collection<PlexRequest>(COLLECTION).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: setFields },
        { returnDocument: "after" }
    );

    return result;
}