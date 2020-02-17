export function navigateToSearch() {
  return {
    type: navigateToSearch,
  };
}

export function navigateToLog() {
  return {
    type: navigateToLog,
  };
}

export function navigateToItemDetails(uuid: string) {
  return {
    type: navigateToItemDetails,
    uuid,
  };
}
