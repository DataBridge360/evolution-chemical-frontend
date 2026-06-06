import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { Error } from '@/src/components/ui/error';

const sizes = {
  xSmall: 'h-6 rounded-md text-xs',
  small: 'h-8 rounded-md text-sm',
  mediumSmall: 'h-10 rounded-md text-sm',
  medium: 'h-10 rounded-md text-sm',
  large: 'h-12 rounded-lg text-base',
};

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange' | 'prefix'
> {
  size?: keyof typeof sizes;
  prefix?: React.ReactNode | string;
  suffix?: React.ReactNode | string;
  prefixStyling?: boolean | string;
  suffixStyling?: boolean | string;
  error?: string | boolean;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      placeholder,
      size = 'medium',
      prefix,
      suffix,
      prefixStyling = true,
      suffixStyling = true,
      disabled = false,
      error,
      label,
      value,
      onChange,
      onFocus,
      onBlur,
      className,
      wrapperClassName,
      ...rest
    },
    forwardedRef,
  ) => {
    const [_value, setValue] = useState(value || '');
    const innerRef = useRef<HTMLInputElement | null>(null);

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
      onChange?.(event.target.value);
    };

    useEffect(() => {
      if (value !== undefined) {
        setValue(value);
      }
    }, [value]);

    return (
      <div className="flex flex-col gap-2" onClick={() => innerRef.current?.focus()}>
        {label && <div className="text-[13px] capitalize text-gray-900">{label}</div>}
        <div
          className={clsx(
            'flex items-center font-sans duration-150',
            error
              ? 'shadow-error-input hover:shadow-error-input-hover'
              : 'border border-gray-alpha-400 focus-within:border-transparent focus-within:shadow-focus-input hover:border-gray-alpha-500',
            sizes[size],
            disabled ? 'cursor-not-allowed bg-gray-100' : 'bg-background-100',
            wrapperClassName,
          )}
        >
          {prefix && (
            <div
              className={clsx(
                'flex h-full items-center justify-center fill-gray-700 text-gray-700',
                prefixStyling === true
                  ? 'border-r border-gray-alpha-400 bg-background-200 px-3'
                  : `pl-3${!prefixStyling ? '' : ` ${prefixStyling}`}`,
                size === 'large' ? 'rounded-l-lg' : 'rounded-l-md',
              )}
            >
              {prefix}
            </div>
          )}
          <input
            className={clsx(
              'inline-flex w-full appearance-none outline-none placeholder:text-gray-900 placeholder:opacity-70',
              size === 'xSmall' || size === 'mediumSmall' ? 'px-2' : 'px-3',
              disabled
                ? 'cursor-not-allowed bg-gray-100 text-gray-700'
                : 'bg-background-100 text-geist-foreground',
              className,
            )}
            placeholder={placeholder}
            disabled={disabled}
            value={_value}
            onChange={handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
            ref={setRefs}
            {...rest}
          />
          {suffix && (
            <div
              className={clsx(
                'flex h-full items-center justify-center fill-gray-700 text-gray-700',
                suffixStyling === true
                  ? 'border-l border-gray-alpha-400 bg-background-200 px-3'
                  : `pr-3 ${!suffixStyling ? '' : ` ${suffixStyling}`}`,
                size === 'large' ? 'rounded-r-lg' : 'rounded-r-md',
              )}
            >
              {suffix}
            </div>
          )}
        </div>
        {typeof error === 'string' && (
          <Error size={size === 'large' ? 'large' : 'small'}>{error}</Error>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
