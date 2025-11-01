import { Type } from '@angular/core';

export type BaseItem = {
  key: string;
  title: string;
  isOpen: boolean;
  icon?: string | null;
};

export type LeafItem = BaseItem & {
  kind: 'leaf';
  comp: Type<any>;
};

export type GroupItem = BaseItem & {
  kind: 'group';
  children: MenuItem[]; // cho phép lồng group
};

export type MenuItem = LeafItem | GroupItem;

export const isLeaf = (m: MenuItem): m is LeafItem => m.kind === 'leaf';
export const isGroup = (m: MenuItem): m is GroupItem => m.kind === 'group';
