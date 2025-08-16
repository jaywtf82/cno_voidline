// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Slider } from '../slider';

// Polyfill ResizeObserver for jsdom
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserver;

function Controlled() {
  const [value, setValue] = React.useState(0);
  return <Slider value={value} onValueChange={setValue} min={0} max={100} step={1} />;
}

describe('Slider loop prevention', () => {
  it('does not trigger recursive updates', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Controlled />);
    const slider = screen.getByRole('slider');
    await userEvent.keyboard('{ArrowRight}');
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
