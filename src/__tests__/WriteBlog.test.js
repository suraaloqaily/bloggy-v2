import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import WritePage from "../app/write/page";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock react-quill
jest.mock("react-quill", () => {
  const MockQuill = ({ value, onChange, placeholder }) => (
    <div data-testid="quill-editor">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
  MockQuill.displayName = "MockQuill";
  return { __esModule: true, default: MockQuill };
});

// Mock next/image
jest.mock("next/image", () => {
  const MockImage = ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt}
      {...props}
    />
  );
  MockImage.displayName = "MockImage";
  return { __esModule: true, default: MockImage };
});

// Mock Loading component
jest.mock("@/components/Loading/Loading", () => {
  const MockLoading = () => <div>Loading...</div>;
  MockLoading.displayName = "MockLoading";
  return MockLoading;
});

describe("WritePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("redirects to home if user is unauthenticated", async () => {
    useSession.mockReturnValue({ status: "unauthenticated", data: null });
    render(<WritePage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
  });

  it("shows loading state when session is loading", () => {
    useSession.mockReturnValue({ status: "loading", data: null });
    render(<WritePage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  describe("Authenticated user interactions", () => {
    beforeEach(() => {
      useSession.mockReturnValue({
        status: "authenticated",
        data: { user: { email: "test@test.com" } },
      });
    });

    it("renders all form elements correctly", () => {
      render(<WritePage />);
      expect(screen.getByPlaceholderText("Title")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByTestId("quill-editor")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /publish/i })
      ).toBeInTheDocument();
    });

    it("handles file upload", async () => {
      const { container } = render(<WritePage />);
      const file = new File(["test"], "test.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]');

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: "data:image/png;base64,test",
        onload: null,
      };
      global.FileReader = jest.fn(() => mockFileReader);

      fireEvent.change(input, { target: { files: [file] } });
      mockFileReader.onload();

      await waitFor(() => {
        expect(container.querySelector(".imagePreview")).toBeInTheDocument();
      });
    });

    it("successfully submits the form", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ slug: "test-title" }),
      });

      render(<WritePage />);

      fireEvent.change(screen.getByPlaceholderText("Title"), {
        target: { value: "Test Title" },
      });

      const quillEditor = screen
        .getByTestId("quill-editor")
        .querySelector("textarea");
      fireEvent.change(quillEditor, {
        target: { value: "Test content" },
      });

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "coding" },
      });

      const publishButton = screen.getByRole("button", { name: /publish/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Test Title",
            desc: "Test content",
            img: "",
            slug: "test-title",
            catSlug: "coding",
          }),
        });
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/posts/test-title");
      });
    });

    it("handles API error responses", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ message: "Bad Request: Please check your input." }),
      });

      render(<WritePage />);

      fireEvent.change(screen.getByPlaceholderText("Title"), {
        target: { value: "Test Title" },
      });

      const quillEditor = screen
        .getByTestId("quill-editor")
        .querySelector("textarea");
      fireEvent.change(quillEditor, {
        target: { value: "Test content" },
      });

      const publishButton = screen.getByRole("button", { name: /publish/i });
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(
          screen.getByText("Bad Request: Please check your input.")
        ).toBeInTheDocument();
      });
    });
  });
});
