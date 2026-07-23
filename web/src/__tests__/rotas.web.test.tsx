/**
 * Testes de integração da UI web — Sprint 3.
 * Mocka `fetch` globalmente; não precisa de servidor real.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import { LoginPage } from "../pages/LoginPage";
import { RotasPage } from "../pages/RotasPage";
import { RotaDetalhePage } from "../pages/RotaDetalhePage";
import { setAccessToken } from "../api/client";

// ── Helpers ──────────────────────────────────────────────
function ok(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}
function fail(body: unknown, status: number) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

beforeEach(() => {
  setAccessToken(null);
  vi.restoreAllMocks();
});

// ── LoginPage ────────────────────────────────────────────
describe("LoginPage", () => {
  it("faz login e redireciona para /rotas", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/auth/refresh")) return fail({}, 401);
      if (u.includes("/auth/login"))
        return ok({ accessToken: "tok", usuario: { id: "u1", nome: "Ana", email: "a@a.com", emailVerificado: true } });
      if (u.includes("/rotas")) return ok([]);
      return fail({}, 404);
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/rotas" element={<RotasPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("E-mail"), "a@a.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(screen.queryByText("Minhas rotas")).toBeInTheDocument());
  });

  it("exibe banner de erro em credenciais inválidas", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/auth/refresh")) return fail({}, 401);
      if (u.includes("/auth/login")) return fail({ erro: "Credenciais inválidas." }, 401);
      return fail({}, 404);
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("E-mail"), "x@x.com");
    await userEvent.type(screen.getByLabelText("Senha"), "errada");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Credenciais inválidas.")
    );
  });

  it("alterna para cadastro e cria conta", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/auth/refresh")) return fail({}, 401);
      if (u.includes("/auth/register"))
        return ok({ accessToken: "tok", usuario: { id: "u2", nome: "Bob", email: "b@b.com", emailVerificado: false } });
      if (u.includes("/rotas")) return ok([]);
      return fail({}, 404);
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/rotas" element={<RotasPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText("Não tem conta? Cadastre-se"));
    await userEvent.type(screen.getByLabelText("Nome"), "Bob");
    await userEvent.type(screen.getByLabelText("E-mail"), "b@b.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.queryByText("Minhas rotas")).toBeInTheDocument());
  });
});

// ── RotasPage ────────────────────────────────────────────
describe("RotasPage", () => {
  it("lista rotas existentes", async () => {
    setAccessToken("tok");
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("/rotas"))
        return ok([
          { id: "r1", status: "planejamento", dataCriacao: new Date().toISOString(), modoOffline: false },
        ]);
      return fail({}, 404);
    });

    render(
      <MemoryRouter initialEntries={["/rotas"]}>
        <AuthProvider>
          <Routes>
            <Route path="/rotas" element={<RotasPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Planejamento")).toBeInTheDocument());
  });

  it("cria nova rota e navega para detalhes", async () => {
    setAccessToken("tok");
    const novaRota = { id: "r2", status: "planejamento", dataCriacao: new Date().toISOString(), modoOffline: false };
    vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
      const u = String(url);
      if ((opts as RequestInit)?.method === "POST" && u.includes("/rotas"))
        return ok(novaRota, 201);
      if (u.includes("/rotas/r2")) return ok({ ...novaRota, paradas: [] });
      if (u.includes("/rotas")) return ok([]);
      return fail({}, 404);
    });

    render(
      <MemoryRouter initialEntries={["/rotas"]}>
        <AuthProvider>
          <Routes>
            <Route path="/rotas" element={<RotasPage />} />
            <Route path="/rotas/:id" element={<RotaDetalhePage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByRole("button", { name: "Nova rota" }));
    await userEvent.click(screen.getByRole("button", { name: "Nova rota" }));

    await waitFor(() => expect(screen.getByText("Paradas")).toBeInTheDocument());
  });
});

// ── RotaDetalhePage ──────────────────────────────────────
describe("RotaDetalhePage", () => {
  it("adiciona parada e exibe na tabela", async () => {
    setAccessToken("tok");
    const rota = { id: "r1", status: "planejamento", dataCriacao: new Date().toISOString(), modoOffline: false, paradas: [] };
    const novaParada = {
      id: "p1", idRota: "r1", enderecoTexto: "Av. Paulista, 1000", latitude: -23.561, longitude: -46.655,
      ordemOriginal: 1, ordemOtimizada: null, janelaHorarioInicio: null, janelaHorarioFim: null,
      prioridade: null, origemEntrada: "manual", status: "pendente", descricaoPacote: null,
    };

    vi.spyOn(globalThis, "fetch").mockImplementation((url, opts) => {
      const u = String(url);
      if (u.includes("/auth/refresh")) return fail({}, 401);
      if ((opts as RequestInit)?.method === "POST" && u.includes("/paradas")) return ok(novaParada, 201);
      if (u.includes("/rotas/r1")) return ok(rota);
      return fail({}, 404);
    });

    render(
      <MemoryRouter initialEntries={["/rotas/r1"]}>
        <AuthProvider>
          <Routes>
            <Route path="/rotas/:id" element={<RotaDetalhePage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByLabelText("Endereço"));
    await userEvent.type(screen.getByLabelText("Endereço"), "Av. Paulista, 1000");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(screen.getByText("Av. Paulista, 1000")).toBeInTheDocument());
  });

  it("valida endereço obrigatório antes de submeter", async () => {
    setAccessToken("tok");
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("/rotas/r1"))
        return ok({ id: "r1", status: "planejamento", dataCriacao: new Date().toISOString(), modoOffline: false, paradas: [] });
      return fail({}, 404);
    });

    render(
      <MemoryRouter initialEntries={["/rotas/r1"]}>
        <AuthProvider>
          <Routes>
            <Route path="/rotas/:id" element={<RotaDetalhePage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByRole("button", { name: "Adicionar" }));
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Informe o endereço da parada.")
    );
  });
});
