export interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (index: number, isValid: boolean) => void;
  index: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
