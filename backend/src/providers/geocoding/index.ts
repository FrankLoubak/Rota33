/**
 * Finalidade: interface GeocodingProvider (D4) + adapters (mock, Nominatim, Google stub) + factory.
 * Como funciona: converte endereço em texto → coordenadas. Desacoplado (skill-decoupling):
 *   `mock` (determinístico, para dev/testes sem rede), `nominatim` (OSM self-hosted/público,
 *   padrão para todos) e `google` (premium para assinantes — stub até haver credenciais).
 * Relações: usado pelo rotaService ao adicionar/editar paradas; seleção por env/tier.
 */
import { config } from "../../config/env";

export interface Coordenada {
  lat: number;
  lng: number;
  enderecoNormalizado: string;
}

export interface GeocodingProvider {
  nome: string;
  geocode(enderecoTexto: string, locale?: string): Promise<Coordenada | null>;
}

// Mock determinístico: gera coords estáveis próximas de São Paulo a partir do texto.
class MockGeocoder implements GeocodingProvider {
  nome = "mock";
  async geocode(enderecoTexto: string): Promise<Coordenada | null> {
    if (!enderecoTexto.trim()) return null;
    let h = 0;
    for (const c of enderecoTexto) h = (h * 31 + c.charCodeAt(0)) % 100000;
    const lat = -23.55 + (h % 1000) / 100000; // pequena variação
    const lng = -46.63 + ((h >> 3) % 1000) / 100000;
    return { lat, lng, enderecoNormalizado: enderecoTexto.trim() };
  }
}

class NominatimGeocoder implements GeocodingProvider {
  nome = "nominatim";
  async geocode(enderecoTexto: string, locale = "pt-BR"): Promise<Coordenada | null> {
    const url = `${config.nominatimUrl}/search?format=json&limit=1&accept-language=${locale}&q=${encodeURIComponent(enderecoTexto)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Rota33/0.1 (geocoding)" } });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!arr.length) return null;
    return { lat: Number(arr[0].lat), lng: Number(arr[0].lon), enderecoNormalizado: arr[0].display_name };
  }
}

// TODO: GoogleGeocoder real (premium/assinantes) quando houver GOOGLE_MAPS_API_KEY.
class GoogleGeocoderStub implements GeocodingProvider {
  nome = "google";
  async geocode(): Promise<Coordenada | null> {
    throw new Error("GoogleGeocoder ainda não implementado (aguardando credenciais).");
  }
}

let instance: GeocodingProvider | undefined;
export function getGeocodingProvider(): GeocodingProvider {
  if (!instance) {
    instance =
      config.geocodingProvider === "nominatim"
        ? new NominatimGeocoder()
        : config.geocodingProvider === "google"
          ? new GoogleGeocoderStub()
          : new MockGeocoder();
  }
  return instance;
}
