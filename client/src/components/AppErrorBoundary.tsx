import React from "react";

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(err: any, info: any) {
    // log if needed
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 border border-red-500 rounded">
          <h2 className="text-red-400 font-semibold">Something broke in this panel.</h2>
          <pre className="text-xs opacity-80 overflow-auto max-h-64">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}
