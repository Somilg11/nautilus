/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from "uuid"

export function createNode(
    type: string,
    position = { x: 250, y: 250 },
    data: any = {}
) {
    return {
        id: uuidv4(),
        type: "default",
        position,
        data: { label: type, ...data },
    }
}
