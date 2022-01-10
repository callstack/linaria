/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/

export interface MethodFactory {
  levels?: any[];
  logger?: LogLevel;
  methods?: string[];

  bindMethod?: (obj: any, methodName: string) => any;
  distillLevel?: (level: string | number) => any;
  levelValid?: (level: string | number) => boolean;
  make?: (methodName: string) => any;
  replaceMethods?: (logLevel: string | number) => void;
}

export interface PrefixFactory extends MethodFactory {
  interpolate(level: string): string;
  make(methodName: string): any;
}

export interface LogLevel {
  factory: MethodFactory;
  disable(): void;
  enable(): void;
  level: any;
  levels: any[];

  debug(...args: any[]): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
  trace(...args: any[]): void;
  warn(...args: any[]): void;
}

export interface DefaultLogger extends LogLevel {
  factories: any;
  loggers: any;

  create(options: any): LogLevel;
}

declare const instance: DefaultLogger

export default instance
