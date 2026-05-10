// File: src/app/api/v1/list/route.ts
import { apiRegistry } from "@/system/database/myapis";

export async function GET() {
    try {
        const sortedList = [...apiRegistry].sort((a, b) => 
            a.category.localeCompare(b.category)
        );
        
        return Response.json(sortedList, { status: 200 });
    } catch (e) {
        return Response.json(
            { status: false, message: "Error listing APIs" }, 
            { status: 500 }
        );
    }
}
