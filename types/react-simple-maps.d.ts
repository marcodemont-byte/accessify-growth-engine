declare module "react-simple-maps" {
  import { ReactNode } from "react";

  export interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string | ((...args: unknown[]) => unknown);
    projectionConfig?: {
      center?: [number, number];
      scale?: number;
      rotate?: [number, number, number];
      [key: string]: unknown;
    };
    className?: string;
    children?: ReactNode;
  }

  export const ComposableMap: (props: ComposableMapProps) => JSX.Element;

  export interface GeographyItem {
    rsmKey: string;
    properties?: { name?: string };
    [key: string]: unknown;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeographyItem[] }) => ReactNode;
    parseGeographies?: (data: unknown) => unknown;
    className?: string;
  }

  export const Geographies: (props: GeographiesProps) => JSX.Element;

  export interface GeographyProps {
    geography: unknown;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: Record<string, unknown>;
      hover?: Record<string, unknown>;
      pressed?: Record<string, unknown>;
    };
    className?: string;
  }

  export const Geography: (props: GeographyProps) => JSX.Element;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
  }

  export const Marker: (props: MarkerProps) => JSX.Element;
}
