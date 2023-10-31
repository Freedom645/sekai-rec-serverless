declare module '@katsube/mimetypesjs' {
  namespace N {
    export interface MieType {
      ext: string;
      type: string;
    }

    function get(filename: string, defaultType?: string): string;
    function set(target: MieType): void;
    function remove(target: string | string[]): void;
    function listAll(): object;
  }

  export default N;
}
