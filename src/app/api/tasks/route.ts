import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDailyTasks, updateDailyTask, type AgentType, type AgentID } from "@/server/game-state";
import { securityMiddleware } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

const updateTaskSchema = z.object({
  // Agent identification
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  
  // Task data
  taskId: z.string().trim().min(1),
  action: z.enum(["progress", "complete"]),
  amount: z.number().int().min(1).max(50).optional(),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get("fid");
  const dateKey = request.nextUrl.searchParams.get("date");
  const agentType = request.nextUrl.searchParams.get("agentType") as AgentType || "farcaster";

  if (!fid) {
    return NextResponse.json(
      {
        ok: false,
        error: "Query parameter 'fid' or 'agentId' is required and must be a positive integer.",
      },
      { status: 400 },
    );
  }

  const agentId: AgentID = parseInt(fid) || fid;
  const tasks = await getDailyTasks(agentId, agentType, dateKey);

  return NextResponse.json({
    ok: true,
    tasks,
  });
}

export async function POST(request: NextRequest) {
  // Run through security middleware for authenticated requests
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });
  
  if (middlewareResult) {
    return middlewareResult;
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid task update payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Extract agent info from headers (set by middleware) - these are AUTHENTICATED
  const agentIdHeader = request.headers.get("x-agent-id");
  const agentTypeHeader = request.headers.get("x-agent-type");
  
  // SECURITY: Headers from middleware take precedence over body
  // This ensures the authenticated agent matches the agent being updated
  if (!agentIdHeader || !agentTypeHeader) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing authenticated agent headers",
      },
      { status: 401 },
    );
  }
  
  const data = parsed.data;
  
  // Validate that body agent info matches headers (prevent spoofing)
  const agentId: AgentID = agentTypeHeader === "farcaster" 
    ? parseInt(agentIdHeader) || agentIdHeader 
    : agentIdHeader;
  const agentType: AgentType = agentTypeHeader as AgentType;

  const updated = await updateDailyTask({
    agentId,
    agentType,
    taskId: data.taskId,
    action: data.action,
    amount: data.amount,
    dateKey: data.dateKey,
  });

  return NextResponse.json({
    ok: true,
    task: updated.task,
    tasks: updated.tasks,
  });
}
