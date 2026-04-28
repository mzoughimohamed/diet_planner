import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { View } from 'react-native';

interface Props {
  consumed: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ consumed, goal, size = 160 }: Props) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const color = progress >= 1 ? '#ef4444' : '#22c55e';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={14} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={14} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
        <SvgText x={size / 2} y={size / 2 - 8} textAnchor="middle" fontSize={22} fontWeight="bold" fill="#111827">
          {consumed}
        </SvgText>
        <SvgText x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize={12} fill="#6b7280">
          / {goal} kcal
        </SvgText>
      </Svg>
    </View>
  );
}
