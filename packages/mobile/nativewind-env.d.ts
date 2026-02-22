/// <reference types="nativewind/types" />

// NativeWind adds className via Babel at runtime, but TypeScript doesn't
// know about it for components whose types aren't augmented by
// react-native-css-interop. Add the missing declarations here.

// The empty export makes this a module so `declare module` augments
// rather than replaces the existing react-native types.
export {};

declare module "react-native" {
  interface PressableProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
}
