export function validateJSON(data) {
    const errors = [];

    if (!data || typeof data !== "object") {
        return { ok: false, errors: ["File is not a JSON object."] };
    }

    if (!data.startSceneId || typeof data.startSceneId !== "string") {
        errors.push("Missing or invalid startSceneId (must be a string).");
    }

    if (!data.scenes || typeof data.scenes !== "object") {
        errors.push("Missing or invalid scenes object.");
    } else {
        for (const [id, scene] of Object.entries(data.scenes)) {
            if (!scene || typeof scene !== "object") {
                errors.push(`Scene "${id}" is not an object.`);
                continue;
            }
            if (scene.id !== id) {
                errors.push(`Scene "${id}" must have matching id property.`);
            }
            if (typeof scene.text !== "string") {
                errors.push(`Scene "${id}" text must be a string.`);
            }
            if (!Array.isArray(scene.choices)) {
                errors.push(`Scene "${id}" choices must be an array.`);
            }
        }
    }

    return { ok: errors.length === 0, errors };
}
