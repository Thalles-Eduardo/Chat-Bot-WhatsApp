const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;

async function evolutionFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!BASE_URL || !API_KEY) {
    throw new Error("EVOLUTION_API_URL and EVOLUTION_API_KEY must be set");
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      apikey: API_KEY,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Evolution API error (${response.status}): ${body}`);
  }

  if (response.status === 204) return {} as T;

  return response.json() as Promise<T>;
}

interface CreateInstanceResponse {
  instance: { instanceName: string; status: string };
  hash: string;
  qrcode?: { base64: string };
}

export async function createInstance(
  instanceName: string,
  webhookUrl: string
): Promise<CreateInstanceResponse> {
  return evolutionFetch<CreateInstanceResponse>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  });
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/delete/${instanceName}`, {
    method: "DELETE",
  });
}

interface ConnectionStateResponse {
  instance: { state: string };
}

export async function getInstanceStatus(
  instanceName: string
): Promise<{ state: string }> {
  const data = await evolutionFetch<ConnectionStateResponse>(
    `/instance/connectionState/${instanceName}`
  );
  return { state: data.instance.state };
}

interface QRCodeResponse {
  base64: string;
  pairingCode?: string;
}

export async function getQRCode(
  instanceName: string
): Promise<QRCodeResponse> {
  return evolutionFetch<QRCodeResponse>(
    `/instance/connect/${instanceName}`
  );
}

interface SendMessageResponse {
  key: { id: string };
}

export async function sendTextMessage(
  instanceName: string,
  phone: string,
  text: string
): Promise<SendMessageResponse> {
  return evolutionFetch<SendMessageResponse>(
    `/message/sendText/${instanceName}`,
    {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        text,
      }),
    }
  );
}

export async function logoutInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/logout/${instanceName}`, {
    method: "DELETE",
  });
}
