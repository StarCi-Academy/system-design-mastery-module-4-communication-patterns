/**
 * Kiểu payload publish/subscribe demo NATS.
 * (EN: NATS pub/sub demo payload types.)
 */

/** Body POST /publish. (EN: POST /publish request body.) */
export interface PublishRequestBody {
    type?: string
    payload?: string | number | boolean | null
}

/** Envelope phát trên subject `app.events`. (EN: Envelope emitted on `app.events`.) */
export interface AppEventEnvelope {
    type: string
    payload: string | number | boolean | null | undefined
    timestamp: string
}

/** Response sau khi publish. (EN: Response after publish.) */
export interface PublishResponse {
    message: string
    type: string
}
