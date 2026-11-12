# Resulting Process ownership

CLI owns `dataset model build-resulting-process` (alias `aggregate`), including numerical aggregation and its result envelope. The Skill selects explicit source data, interprets findings and routes a reviewed candidate to a separate native create/save request. It neither adds a publish envelope nor owns relation persistence.

Platform owns editing and presentation. Worker owns Model calculation. A resulting Process candidate and a Model LCIA Run are distinct artifacts; neither a local file nor a successful generation publishes data.
