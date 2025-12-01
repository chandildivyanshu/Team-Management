import User from "@/models/User";
import Activity from "@/models/Activity";
import DailyPlan from "@/models/DailyPlan";

import { deleteS3Object } from "@/lib/s3";

export async function deleteUserRecursively(userId: string) {
    // 1. Find the user to ensure they exist (optional, but good for safety)
    const user = await User.findById(userId);
    if (!user) return;

    // 2. Find all direct reports
    const directReports = await User.find({ managerId: userId });

    // 3. Recursively delete all direct reports
    for (const report of directReports) {
        await deleteUserRecursively(report._id.toString());
    }

    // 4. Delete all activities created by this user
    // First, find activities to get photo keys
    const activities = await Activity.find({ creatorId: userId });
    for (const activity of activities) {
        if (activity.photos && activity.photos.length > 0) {
            for (const photo of activity.photos) {
                if (photo.key) {
                    await deleteS3Object(photo.key);
                }
            }
        }
    }
    await Activity.deleteMany({ creatorId: userId });

    // 5. Delete all daily plans for this user
    await DailyPlan.deleteMany({ userId: userId });

    // 6. Delete profile picture from S3 if exists
    if (user.profilePicUrl && user.profilePicUrl.includes("/api/images/")) {
        const key = user.profilePicUrl.split("/api/images/")[1];
        if (key) {
            await deleteS3Object(key);
        }
    }

    // 7. Delete the user
    await User.findByIdAndDelete(userId);

    console.log(`Deleted user ${user.name} (${user.role}) and their data.`);
}

export async function getAllSubordinateIds(userId: string): Promise<string[]> {
    const directReports = await User.find({ managerId: userId });
    let allIds = directReports.map(u => u._id.toString());

    for (const report of directReports) {
        const subIds = await getAllSubordinateIds(report._id.toString());
        allIds = [...allIds, ...subIds];
    }

    return allIds;
}
