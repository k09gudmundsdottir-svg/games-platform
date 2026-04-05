import { Component, ReactNode } from "react";

// Error boundary — if presence crashes, the rest of the app still works
class PresenceErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("Presence system error (non-fatal):", error);
  }
  render() {
    if (this.state.hasError) return <>{this.props.children}</>;
    return this.props.children;
  }
}

export default PresenceErrorBoundary;
