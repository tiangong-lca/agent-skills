const entries = [
  [
    "search",
    [
      "dataset",
      "flow",
      "search"
    ]
  ],
  [
    "get",
    [
      "dataset",
      "flow",
      "get"
    ]
  ],
  [
    "list",
    [
      "dataset",
      "flow",
      "list"
    ]
  ],
  [
    "versions",
    [
      "dataset",
      "flow",
      "versions"
    ]
  ],
  [
    "contract",
    [
      "dataset",
      "flow",
      "contract"
    ]
  ],
  [
    "list-references",
    [
      "dataset",
      "flow",
      "list-references"
    ]
  ],
  [
    "validate",
    [
      "dataset",
      "flow",
      "validate"
    ]
  ],
  [
    "diff",
    [
      "dataset",
      "flow",
      "diff"
    ]
  ],
  [
    "patch",
    [
      "dataset",
      "flow",
      "patch"
    ]
  ],
  [
    "create",
    [
      "dataset",
      "flow",
      "create"
    ]
  ],
  [
    "save",
    [
      "dataset",
      "flow",
      "save"
    ]
  ],
  [
    "delete",
    [
      "dataset",
      "flow",
      "delete"
    ]
  ]
];

export const flowGovernanceCliCommandEntries = Object.freeze(
  entries.map(([wrapperCommand, cliArgv]) =>
    Object.freeze({
      wrapperCommand,
      cliArgv: Object.freeze([...cliArgv]),
    }),
  ),
);

const commandIndex = new Map(
  flowGovernanceCliCommandEntries.map(({ wrapperCommand, cliArgv }) => [
    wrapperCommand,
    cliArgv,
  ]),
);

export function resolveFlowGovernanceCliArgv(wrapperCommand) {
  const cliArgv = commandIndex.get(wrapperCommand);
  return cliArgv ? [...cliArgv] : null;
}
