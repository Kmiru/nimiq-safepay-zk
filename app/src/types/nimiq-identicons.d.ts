declare module '@nimiq/identicons' {
  const Identicons: {
    svg(text: string): Promise<string>
    toDataUrl(text: string): Promise<string>
    render(text: string, element: Element): Promise<void>
    image(text: string): Promise<HTMLImageElement>
    placeholder(color?: string, strokeWidth?: number): string
    placeholderToDataUrl(color?: string, strokeWidth?: number): string
    renderPlaceholder(
      element: Element,
      color?: string,
      strokeWidth?: number,
    ): void
  }

  export default Identicons
}
