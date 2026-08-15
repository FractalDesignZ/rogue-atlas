import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

type ProjectInput = {
  name: string;
  domain: string;
  config: Record<string, unknown>;
};

type CertificateInput = {
  projectId: string;
  title: string;
  verdict: string;
  payload: Record<string, unknown>;
};

export const listProjects = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      name: string;
      domain: string;
      config: unknown;
      created_at: string;
    }>`
      select id, name, domain, config, created_at
      from projects
      where user_id = ${context.userId}
      order by created_at desc
    `;
  });

export const saveProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ProjectInput) => ({
    name: input.name.trim().slice(0, 80),
    domain: input.domain.slice(0, 32),
    config: input.config ?? {},
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = `prj_${crypto.randomUUID().slice(0, 12)}`;
    await sql`
      insert into projects (id, user_id, name, domain, config)
      values (${id}, ${context.userId}, ${data.name}, ${data.domain}, ${JSON.stringify(data.config)}::jsonb)
    `;
    return { id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from projects where id = ${id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const saveCertificate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: CertificateInput) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = `crt_${crypto.randomUUID().slice(0, 12)}`;
    await sql`
      insert into certificates (id, user_id, project_id, title, verdict, payload)
      values (${id}, ${context.userId}, ${data.projectId}, ${data.title}, ${data.verdict}, ${JSON.stringify(data.payload)}::jsonb)
    `;
    return { id };
  });
