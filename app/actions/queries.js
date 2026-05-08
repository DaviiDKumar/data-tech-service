"use server";
import connectDB from "@/lib/db";
import Query from "@/models/Queries";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";



export async function createTicket(formData) {
  await connectDB();
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) throw new Error("Unauthorized");

  const subject = formData.get("subject");
  const category = formData.get("category");
  const message = formData.get("message");

  const newTicket = await Query.create({
    user: userId, // Fixed: Matches schema field 'user'
    subject,
    category,
    messages: [{ sender: 'user', text: message }]
  });

  revalidatePath("/user/queries");
  redirect(`/user/queries?id=${newTicket._id}`);
}

export async function sendMessage(queryId, text) {
  await connectDB();
  await Query.findByIdAndUpdate(queryId, {
    $push: { messages: { sender: "user", text, timestamp: new Date() } },
    $set: { status: "open" }
  });
  revalidatePath("/user/queries");
}



export async function adminReply(queryId, text) {
  await connectDB();

  await Query.findByIdAndUpdate(queryId, {
    $push: {
      messages: { sender: "admin", text, timestamp: new Date() }
    },
    $set: { status: "in-progress" }
  });

  revalidatePath("/admin/queries");
}


export async function closeTicket(queryId) {
  await connectDB();

  // 1. Update the status to 'closed'
  await Query.findByIdAndUpdate(queryId, {
    $set: { status: "closed" }
  });

  // 2. Refresh the queries pages
  revalidatePath("/admin/queries");
  revalidatePath("/user/queries");
}