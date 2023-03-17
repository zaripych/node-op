import { Text } from 'ink';

interface IProps {
  value: string;
}

export const Keystroke: React.FC<IProps> = (props) => {
  return (
    <Text color="red" bold>
      {props.value}
    </Text>
  );
};
