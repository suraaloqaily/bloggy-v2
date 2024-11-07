import "@testing-library/jest-dom";
import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
global.FileReader = class {
  constructor() {
    this.readAsDataURL = jest.fn();
  }
};

 global.URL.createObjectURL;
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => ""),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    status: "unauthenticated",
    data: null,
  })),
  signIn: jest.fn(),
  SessionProvider: ({ children }) => children,
}));
