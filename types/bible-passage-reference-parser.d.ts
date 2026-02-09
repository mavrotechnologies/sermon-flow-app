declare module 'bible-passage-reference-parser/js/en_bcv_parser' {
  export interface BCVParser {
    parse(text: string): BCVParser;
    osis(): string;
    osis_and_indices(): Array<{
      osis: string;
      indices: [number, number];
    }>;
  }

  export const bcv_parser: new () => BCVParser;
}
