import connectDB from "@/lib/db";
import Query from "@/models/Queries";
import User from "@/models/User"; // Required for populate
import AdminTicketClient from "./AdminTicketClient";

export default async function AdminQueriesPage({ searchParams }) {
  const params = await searchParams;
  
  await connectDB();

  // Fetch all queries and populate user data
  const allQueries = await Query.find()
    .populate('user', 'name email loginId kycStatus')
    .sort({ updatedAt: -1 })
    .lean();

  // Convert MongoDB objects to plain JSON for the Client Component
  const serializedQueries = JSON.parse(JSON.stringify(allQueries));

  return (
    <AdminTicketClient 
      initialQueries={serializedQueries} 
      initialSelectedId={params.id} 
    />
  );
}