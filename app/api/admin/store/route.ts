import { verifyAdminRequest } from "../../../admin-auth";
import { validateStorePayload, writeStore } from "../../../store-kv";

async function canWrite(request: Request) {
  return verifyAdminRequest(request);
}

export async function POST(request: Request) {
  if (!(await canWrite(request))) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const payload = validateStorePayload(await request.json());
  if (!payload) return Response.json({ error: "Dados da loja inválidos" }, { status: 400 });

  try {
    const result = await writeStore(payload);
    return Response.json(result);
  } catch (error) {
    if (error instanceof RangeError && error.message === "STORE_TOO_LARGE") {
      return Response.json({ error: "O catálogo ultrapassou o limite do KV. Use URLs para imagens grandes." }, { status: 413 });
    }
    return Response.json({ error: "Não foi possível salvar a loja." }, { status: 503 });
  }
}
