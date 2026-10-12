import { Router } from "express";
import { authCheck } from "../middlewares/authCheck.js";
import { env } from "../config/env.js";

export const aiRouter = Router();
aiRouter.use(authCheck);

const systemPrompt = `You are Spectra AI, a senior principal backend architect and implementation graph planner.
Create a complete, production-oriented architecture graph from the user's description and explicit project technology metadata. Optimize for correctness, traceability, and implementation clarity rather than the smallest possible graph.

INVARIANTS
- Cover every explicitly requested use case, API branch, security step, validation boundary, service responsibility, integration, package, persistence operation, and data relationship. Do not collapse distinct responsibilities into a vague generic node.
- Do not add speculative product features or named vendors. You may add implementation-essential validation, service, persistence, and data fields when they are required to make an explicitly requested flow implementable.
- Project framework and database metadata are authoritative. Never replace them with another technology.
- Preserve user terminology. Do not claim requirements that were not requested.
- Every edge must reference node IDs present in the response. No self-links, duplicate links, or disconnected decorative nodes.
- There is no fixed node limit. Use as many nodes as the requested system genuinely requires, while avoiding duplicates and decorative nodes. Keep edges purposeful and readable. A normal product should usually fit in 8-40 well-defined nodes; exceed that only when the explicit scope genuinely requires it. Never create separate nodes for database fields or trivial sub-steps.
- Allowed node kinds are client, endpoint, graphql, gateway, auth, service, database, middleware, validation, cache, payment, vector, ai, custom, comment, queue, loadBalancer, notification, storage, cdn, external, cron, webhook, and config.
- Represent only trigger roots required by the requested architecture. User-driven flows begin at one client node; incoming provider events begin at a webhook node; time-driven flows begin at a cron node. Do not force webhook or cron branches through a client.
- Every REST endpoint and GraphQL operation in a user-driven branch MUST be reachable from the client node, optionally through a load balancer or API gateway. Incoming webhook and scheduled-job branches are valid independent roots.
- Build each request branch in this order whenever those responsibilities exist: client -> endpoint -> validation/auth/middleware -> service -> package or external integration -> database/cache/vector store.
- Never place a database, package, service, or middleware before an endpoint. Never connect the client directly to internal implementation nodes.
- Reuse a shared auth, middleware, service, or database node when multiple endpoints truly share it; otherwise keep branches separate and readable.
- Edges represent execution direction and must point from the caller toward the final dependency or data store.
- Endpoint detail MUST begin with the exact HTTP method and route, for example POST /api/orders.
- Every endpoint MUST define requestFields as the exact request-body keys accepted by that operation. GET/DELETE operations and endpoints without a JSON body must use an empty array. A body-bearing endpoint MUST set requestSourceNodeId to exactly one reachable downstream database node, and every requestFields entry MUST exactly match a field on that table. Include a reference ID only when that ID field exists on the selected table; never copy a referenced resource schema or derive fields from prose.
- Populate protocol, authentication, cache, schedule, environment/config, and non-functional metadata only when explicit or implementation-essential. Use null/empty values when unspecified; never invent service-level objectives.
- Queue/event edges MUST use connectionType async. Ordinary request/dependency calls use sync. Webhook nodes represent incoming external events, and cron nodes represent scheduled triggers.
- GraphQL detail MUST begin with QUERY, MUTATION, or SUBSCRIPTION followed by the operation name.
- Gateway nodes MUST identify their rate-limit, routing, proxy, or policy responsibility and the configured package/provider when known.
- Validation nodes MUST state what input they validate. Middleware and auth nodes MUST state their concrete responsibility. Service nodes MUST state the business operation they own.
- Represent an explicitly required runtime package or library as kind custom with tag PKG and identify its purpose in detail. Do not invent a package vendor.

DATABASE CONTRACT
- Every database node MUST contain an implementation-ready field list, not an empty placeholder.
- Include the primary identifier, fields required by the requested operations, ownership/reference fields, status/state fields, and essential timestamps where persistence semantics require them.
- Use precise field names and the closest supported type. Never use String when Boolean, Number, Date, UUID, ObjectId, Array, JSON, Enum, Integer, Float, Decimal128, BigInt, Text, or Timestamp is more accurate.
- Mark primary, foreign, required, and unique flags accurately. A primary field must also be required. Do not mark fields unique without a real uniqueness invariant.
- Preserve default values, enum choices, indexes, PII/sensitivity classification, relationship cardinality, and on-delete/on-update behavior when represented or explicitly requested. Never place real secret values in configKeys.
- A foreign field MUST set reference to the exact target as TableName.fieldName and its type must be compatible with the referenced primary field.
- For every foreign-key relationship, add a database-to-database edge from the referenced table to the dependent table. Set sourceField and targetField to the exact field names. For execution-flow edges, both field values must be null.
- Non-database nodes MUST return empty fields and indexes arrays. Non-endpoint/non-webhook nodes MUST return an empty requestFields array. Nodes without an endpoint request-body contract MUST return requestSourceNodeId as null.
- If the request is ambiguous, model only the unambiguous core and record missing decisions in summary; do not guess.
- Return schema-compliant JSON only. Never return markdown or executable code.`;

const graphSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "nodes", "edges"],
  properties: {
    summary: { type: "string", maxLength: 300 },
    nodes: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "label",
          "kind",
          "tag",
          "detail",
          "fields",
          "requestFields",
          "requestSourceNodeId",
          "category",
          "packageName",
          "protocol",
          "schedule",
          "authStrategy",
          "oauthProvider",
          "callbackRoute",
          "configKeys",
          "cacheStrategy",
          "cacheTtl",
          "expectedLatency",
          "expectedThroughput",
          "scalingNotes",
          "stateless",
          "indexes",
        ],
        properties: {
          id: { type: "string", pattern: "^[a-z][a-z0-9_-]{1,30}$" },
          label: { type: "string", minLength: 2, maxLength: 60 },
          kind: {
            type: "string",
            enum: [
              "client",
              "endpoint",
              "graphql",
              "gateway",
              "auth",
              "service",
              "database",
              "middleware",
              "validation",
              "cache",
              "payment",
              "vector",
              "ai",
              "custom",
              "comment",
              "queue",
              "loadBalancer",
              "notification",
              "storage",
              "cdn",
              "external",
              "cron",
              "webhook",
              "config",
            ],
          },
          tag: { type: "string", minLength: 2, maxLength: 12 },
          detail: { type: "string", minLength: 2, maxLength: 140 },
          category: { type: ["string", "null"], maxLength: 60 },
          packageName: { type: ["string", "null"], maxLength: 100 },
          protocol: {
            type: ["string", "null"],
            enum: ["REST", "GraphQL", "gRPC", "WebSocket", null],
          },
          schedule: { type: ["string", "null"], maxLength: 80 },
          authStrategy: {
            type: ["string", "null"],
            enum: ["JWT", "Session", "OAuth 2.0", "OIDC", "API key", null],
          },
          oauthProvider: { type: ["string", "null"], maxLength: 80 },
          callbackRoute: { type: ["string", "null"], maxLength: 120 },
          configKeys: {
            type: "array",
            maxItems: 30,
            items: { type: "string", pattern: "^[A-Z][A-Z0-9_]{1,79}$" },
          },
          cacheStrategy: {
            type: ["string", "null"],
            enum: [
              "cache-aside",
              "write-through",
              "write-behind",
              "read-through",
              null,
            ],
          },
          cacheTtl: { type: ["string", "null"], maxLength: 60 },
          expectedLatency: { type: ["string", "null"], maxLength: 80 },
          expectedThroughput: { type: ["string", "null"], maxLength: 80 },
          scalingNotes: { type: ["string", "null"], maxLength: 180 },
          stateless: { type: "boolean" },
          requestFields: {
            type: "array",
            maxItems: 30,
            items: { type: "string", pattern: "^[A-Za-z_][A-Za-z0-9_]{0,63}$" },
          },
          requestSourceNodeId: {
            type: ["string", "null"],
            pattern: "^[a-z][a-z0-9_-]{1,30}$",
          },
          indexes: {
            type: "array",
            maxItems: 20,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "fields", "type"],
              properties: {
                name: { type: "string", minLength: 1, maxLength: 60 },
                fields: { type: "string", minLength: 1, maxLength: 180 },
                type: {
                  type: "string",
                  enum: ["single", "compound", "text", "unique"],
                },
              },
            },
          },
          fields: {
            type: "array",
            maxItems: 50,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "name",
                "type",
                "primary",
                "foreign",
                "required",
                "unique",
                "reference",
                "defaultValue",
                "enumValues",
                "indexed",
                "relationship",
                "onDelete",
                "onUpdate",
                "sensitivity",
              ],
              properties: {
                name: { type: "string", minLength: 1, maxLength: 50 },
                type: {
                  type: "string",
                  enum: [
                    "ObjectId",
                    "String",
                    "Number",
                    "Boolean",
                    "Date",
                    "Array",
                    "Mixed",
                    "Decimal128",
                    "UUID",
                    "Integer",
                    "Float",
                    "Text",
                    "JSON",
                    "Timestamp",
                    "Enum",
                    "BigInt",
                  ],
                },
                primary: { type: "boolean" },
                foreign: { type: "boolean" },
                required: { type: "boolean" },
                unique: { type: "boolean" },
                reference: { type: ["string", "null"], maxLength: 100 },
                defaultValue: { type: ["string", "null"], maxLength: 120 },
                enumValues: { type: ["string", "null"], maxLength: 300 },
                indexed: { type: "boolean" },
                relationship: {
                  type: ["string", "null"],
                  enum: ["one-to-one", "one-to-many", "many-to-many", null],
                },
                onDelete: {
                  type: ["string", "null"],
                  enum: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION", null],
                },
                onUpdate: {
                  type: ["string", "null"],
                  enum: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION", null],
                },
                sensitivity: {
                  type: "string",
                  enum: ["None", "PII", "Sensitive", "Restricted"],
                },
              },
            },
          },
        },
      },
    },
    edges: {
      type: "array",
      maxItems: 120,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "source",
          "target",
          "sourceField",
          "targetField",
          "connectionType",
          "protocol",
        ],
        properties: {
          source: { type: "string" },
          target: { type: "string" },
          sourceField: { type: ["string", "null"], maxLength: 50 },
          targetField: { type: ["string", "null"], maxLength: 50 },
          connectionType: { type: "string", enum: ["sync", "async"] },
          protocol: { type: ["string", "null"], maxLength: 40 },
        },
      },
    },
  },
};

aiRouter.post("/graph", async (req, res, next) => {
  try {
    if (!env.openAiApiKey)
      return res.status(503).json({
        message:
          "Spectra AI is not configured. Add OPENAI_API_KEY on the backend.",
      });
    const prompt = String(req.body.prompt || "").trim();
    if (prompt.length < 12 || prompt.length > 2000)
      return res.status(400).json({
        message: "Describe the architecture in 12 to 2,000 characters.",
      });
    const metadata = {
      projectName: String(req.body.projectName || "").slice(0, 80),
      framework: String(req.body.framework || "Not specified").slice(0, 60),
      database: String(req.body.database || "Not specified").slice(0, 40),
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.openAiGraphModel,
        instructions: systemPrompt,
        input: `PROJECT METADATA\n${JSON.stringify(metadata)}\n\nUSER REQUEST\n${prompt}`,
        reasoning: { effort: "low" },
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "spectra_architecture_graph",
            strict: true,
            schema: graphSchema,
          },
        },
        max_output_tokens: 20000,
        store: false,
        prompt_cache_key: "spectra-graph-v4-system-design-contract",
      }),
      signal: AbortSignal.timeout(120000),
    });
    const payload = (await response.json()) as {
      status?: string;
      incomplete_details?: { reason?: string };
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      error?: { message?: string };
      usage?: unknown;
    };
    if (!response.ok)
      return res.status(502).json({
        message:
          payload.error?.message ||
          "The AI provider could not generate a graph.",
      });
    if (payload.status === "incomplete") {
      return res.status(502).json({
        message:
          payload.incomplete_details?.reason === "max_output_tokens"
            ? "The architecture exceeded the AI output budget. Narrow the product scope or generate it module by module."
            : "Spectra AI returned an incomplete architecture. Please retry the request.",
      });
    }
    const outputText =
      payload.output_text ||
      payload.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")?.text;
    if (!outputText)
      return res
        .status(502)
        .json({ message: "Spectra AI returned an empty graph." });
    let graph: {
      summary: string;
      nodes: Array<{
        id: string;
        label: string;
        kind: string;
        tag: string;
        detail: string;
        fields: unknown[];
        requestFields: string[];
        [key: string]: unknown;
      }>;
      edges: Array<{
        source: string;
        target: string;
        sourceField: string | null;
        targetField: string | null;
        connectionType: "sync" | "async";
        protocol: string | null;
      }>;
    };
    try {
      graph = JSON.parse(outputText) as typeof graph;
    } catch {
      return res.status(502).json({
        message:
          "Spectra AI returned an incomplete JSON graph. Retry once, or split a very large system into modules.",
      });
    }
    let client = graph.nodes.find((node) => node.kind === "client");
    const hasUserOperations = graph.nodes.some(
      (node) => node.kind === "endpoint" || node.kind === "graphql",
    );
    if (!client && hasUserOperations) {
      client = {
        id: "application_user",
        label: "Application user",
        kind: "client",
        tag: "USER",
        detail: "STARTS API requests",
        fields: [],
        requestFields: [],
        requestSourceNodeId: null,
        category: "Actor",
        packageName: null,
        protocol: null,
        schedule: null,
        authStrategy: null,
        oauthProvider: null,
        callbackRoute: null,
        configKeys: [],
        cacheStrategy: null,
        cacheTtl: null,
        expectedLatency: null,
        expectedThroughput: null,
        scalingNotes: null,
        stateless: false,
        indexes: [],
      };
      graph.nodes.unshift(client);
    }
    const ids = new Set(graph.nodes.map((node) => node.id));
    graph.edges = graph.edges.filter(
      (edge) =>
        ids.has(edge.source) &&
        ids.has(edge.target) &&
        edge.source !== edge.target,
    );
    const endpointIds = graph.nodes
      .filter((node) => node.kind === "endpoint" || node.kind === "graphql")
      .map((node) => node.id);
    endpointIds.forEach((endpointId) => {
      if (!client) return;
      if (
        !graph.edges.some(
          (edge) => edge.source === client.id && edge.target === endpointId,
        )
      ) {
        graph.edges.unshift({
          source: client.id,
          target: endpointId,
          sourceField: null,
          targetField: null,
          connectionType: "sync",
          protocol: null,
        });
      }
    });
    const uniqueEdges = new Map(
      graph.edges.map((edge) => [`${edge.source}->${edge.target}`, edge]),
    );
    graph.edges = [...uniqueEdges.values()];
    return res.json({ graph, usage: payload.usage });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return res.status(504).json({
        message:
          "Spectra AI needs more time for this architecture. Try a slightly smaller scope or generate the main modules separately.",
      });
    }
    return next(error);
  }
});

const assistantPrompt = `You are Spectra Architecture Assistant, a senior backend architecture reviewer.
The supplied canvas snapshot is the only source of truth. Answer the user's question using only its nodes, fields, and directed edges.

RULES
- Never invent an endpoint, dependency, technology, database field, security control, or connection.
- Treat requestFields as the authoritative request-body contract for an endpoint. requestSourceNodeId identifies its connected database schema, and requestFields must be a strict subset of that table's fields with matching types. Never merge any other connected node or referenced table schema into that endpoint body.
- Interpret webhook and cron nodes as independent external/time-driven roots. Respect sync versus async connectionType and never describe an async event as a synchronous request.
- Preserve and reason over PII classification, indexes, relationship/cascade rules, cache strategy, protocol, OAuth/config metadata, and explicit non-functional targets when present.
- If the graph cannot answer the question, say exactly what is missing.
- Treat edges as execution/dependency direction from source to target.
- For dependency questions, count and name only nodes reachable through supplied edges. Distinguish direct from transitive dependencies.
- For security-change questions, explain the concrete affected path, threat, likelihood, impact, and mitigation represented by or missing from the graph.
- When asked to critique the architecture, inspect for high fan-out/god services, shared database ownership, circular service dependencies, missing async boundaries, missing rate limiting, and misplaced responsibilities. Report only anti-patterns supported by graph evidence.
- For natural-language search questions such as "show payment flow" or "which endpoints lack rate limiting", return every relevant node in evidence so the canvas can highlight and frame the result set.
- Identify evidence using exact node IDs and labels from the snapshot.
- Use selectedNodeId when the user says "this", "selected", or otherwise refers to a specific node. If selectedNodeId is null, ask for a label instead of listing unrelated examples.
- Do not expose raw internal node or edge IDs in prose; node IDs are allowed only in evidence.nodeId for UI navigation.
- Never add placeholder items such as "-", empty strings, "none", or "N/A" to risks or recommendations. Return an empty array when there is nothing useful to add.
- Do not mutate the graph or claim that a change has been applied.
- Keep the main answer under 180 words, concise, technical, and actionable. Put secondary detail in risks and recommendations. Return schema-compliant JSON only.`;

const assistantSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "confidence", "evidence", "risks", "recommendations"],
  properties: {
    answer: { type: "string", minLength: 1, maxLength: 1800 },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    evidence: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nodeId", "label", "reason"],
        properties: {
          nodeId: { type: "string", maxLength: 100 },
          label: { type: "string", maxLength: 100 },
          reason: { type: "string", maxLength: 280 },
        },
      },
    },
    risks: {
      type: "array",
      maxItems: 8,
      items: { type: "string", maxLength: 300 },
    },
    recommendations: {
      type: "array",
      maxItems: 8,
      items: { type: "string", maxLength: 300 },
    },
  },
};

aiRouter.post("/chat", async (req, res, next) => {
  try {
    if (!env.openAiApiKey)
      return res.status(503).json({
        message:
          "Spectra AI is not configured. Add OPENAI_API_KEY on the backend.",
      });
    const question = String(req.body.question || "").trim();
    if (question.length < 3 || question.length > 600)
      return res
        .status(400)
        .json({ message: "Ask a question between 3 and 600 characters." });
    const nodes = Array.isArray(req.body.nodes)
      ? req.body.nodes.slice(0, 80)
      : [];
    const edges = Array.isArray(req.body.edges)
      ? req.body.edges.slice(0, 160)
      : [];
    if (!nodes.length)
      return res.status(400).json({
        message:
          "Add nodes to the canvas before asking about the architecture.",
      });
    const history = Array.isArray(req.body.history)
      ? req.body.history
          .slice(-6)
          .map((item: { role?: unknown; content?: unknown }) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: String(item.content || "").slice(0, 1200),
          }))
      : [];
    const snapshot = {
      project: {
        name: String(req.body.project?.name || "").slice(0, 80),
        framework: String(req.body.project?.framework || "").slice(0, 60),
        database: String(req.body.project?.database || "").slice(0, 40),
      },
      selectedNodeId: nodes.some(
        (node: { id?: unknown }) =>
          String(node.id || "") === String(req.body.selectedNodeId || ""),
      )
        ? String(req.body.selectedNodeId)
        : null,
      nodes: nodes.map(
        (node: { id?: unknown; data?: Record<string, unknown> }) => ({
          id: String(node.id || ""),
          label: String(node.data?.label || ""),
          kind: String(node.data?.kind || ""),
          detail: String(node.data?.detail || ""),
          category: String(node.data?.category || ""),
          packageName: String(node.data?.packageName || ""),
          protocol: node.data?.protocol || null,
          schedule: node.data?.schedule || null,
          authStrategy: node.data?.authStrategy || null,
          oauthProvider: node.data?.oauthProvider || null,
          configKeys: Array.isArray(node.data?.configKeys)
            ? node.data.configKeys
            : [],
          requestFields: Array.isArray(node.data?.requestFields)
            ? node.data.requestFields
            : [],
          requestSourceNodeId: node.data?.requestSourceNodeId || null,
          cacheStrategy: node.data?.cacheStrategy || null,
          cacheTtl: node.data?.cacheTtl || null,
          expectedLatency: node.data?.expectedLatency || null,
          expectedThroughput: node.data?.expectedThroughput || null,
          scalingNotes: node.data?.scalingNotes || null,
          stateless: Boolean(node.data?.stateless),
          indexes: Array.isArray(node.data?.indexes) ? node.data.indexes : [],
          fields: Array.isArray(node.data?.fields) ? node.data.fields : [],
        }),
      ),
      edges: edges.map(
        (edge: {
          source?: unknown;
          target?: unknown;
          sourceHandle?: unknown;
          targetHandle?: unknown;
          data?: Record<string, unknown>;
        }) => ({
          source: String(edge.source || ""),
          target: String(edge.target || ""),
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
          connectionType: edge.data?.connectionType || "sync",
        }),
      ),
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.openAiGraphModel,
        instructions: assistantPrompt,
        input: `CANVAS SNAPSHOT\n${JSON.stringify(snapshot)}\n\nRECENT CHAT\n${JSON.stringify(history)}\n\nUSER QUESTION\n${question}`,
        reasoning: { effort: "low" },
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "spectra_architecture_answer",
            strict: true,
            schema: assistantSchema,
          },
        },
        max_output_tokens: 2200,
        store: false,
        prompt_cache_key: "spectra-architecture-assistant-v2-full-contract",
      }),
      signal: AbortSignal.timeout(60000),
    });
    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      error?: { message?: string };
    };
    if (!response.ok)
      return res.status(502).json({
        message:
          payload.error?.message ||
          "The architecture assistant could not answer.",
      });
    const outputText =
      payload.output_text ||
      payload.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")?.text;
    if (!outputText)
      return res.status(502).json({
        message: "The architecture assistant returned an empty answer.",
      });
    try {
      return res.json({ result: JSON.parse(outputText) });
    } catch {
      return res.status(502).json({
        message:
          "The architecture assistant returned an invalid response. Please retry.",
      });
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      return res.status(504).json({
        message:
          "The architecture assistant timed out. Try a more focused question.",
      });
    return next(error);
  }
});
