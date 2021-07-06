import { KyukoRequest, KyukoResponse } from '../mod.ts'

export interface KyukoRequestWithJson extends KyukoRequest {
  // deno-lint-ignore no-explicit-any
  requestBody: any;
}

export async function json(req: KyukoRequest, res: KyukoResponse) {
  const contentType = req.headers.get('content-type');
  res.headers.append('Content-Type', 'application/json; charset=utf-8');
  if (contentType?.includes('application/json')) {
    const requestClone = req.clone();
    const json = await requestClone.json();
    (req as KyukoRequestWithJson).requestBody = json;
  }
}
