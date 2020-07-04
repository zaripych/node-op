export function setVault(vault?: string) {
  return {
    type: setVault,
    vault,
  };
}
