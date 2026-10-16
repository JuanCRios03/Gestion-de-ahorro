import { colorForSlot } from '../theme/palette';
import { useColorMode } from '../lib/useColorMode';

export default function CategoryBadge({ nombre, color, size = 'sm' }) {
  const mode = useColorMode();
  const hex = colorForSlot(color, mode);
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
      style={{ backgroundColor: `${hex}1a`, color: hex }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {nombre}
    </span>
  );
}
