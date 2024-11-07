import { SessionProvider } from "next-auth/react";
import SignupPage from "../app/signup/page";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "unauthenticated",
  }),
  signIn: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock fetch
global.fetch = jest.fn();

describe("SignupPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    global.fetch.mockReset();
  });

  test("renders sign up form and submits data", async () => {
    // Mock successful API response
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      })
    );

    // Mock successful signIn
    signIn.mockImplementationOnce(() => Promise.resolve({ error: null }));

    render(
      <SessionProvider session={null}>
        <SignupPage />
      </SessionProvider>
    );

    // Get form elements
    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    // Fill in form
    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit form
    fireEvent.click(submitButton);

    // Wait for and verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          image: "",
        }),
      });
    });

    // Verify signIn was called
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        redirect: false,
        email: "test@example.com",
        password: "password123",
      });
    });

    // Verify router push was called
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });

  test("handles signup error", async () => {
    // Mock failed API response
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: "Signup failed" }),
      })
    );

    render(
      <SessionProvider session={null}>
        <SignupPage />
      </SessionProvider>
    );

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    fireEvent.click(submitButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText("Signup failed")).toBeInTheDocument();
    });
  });
});
