export type SecSearchSource = {
  file_date?: string;
  form?: string;
  display_names?: string[];
  root_forms?: string[];
  title?: string;
  summary?: string;
  description?: string;
  primary_doc_description?: string;
  items?: string | string[];
  ciks?: string[];
  adsh?: string;
  file_name?: string;
  linkToFilingDetails?: string;
};

export type SecSearchHit = {
  _id?: string;
  _source?: SecSearchSource;
  highlight?: Record<string, string | string[]>;
};

export type SecSearchResponse = {
  hits?: { total?: { value?: number }; hits?: SecSearchHit[] };
};

export type IssuerFilingRetrieval = {
  query: string;
  queryUrl: string;
  filings: SecSearchHit[];
  totalRecords: number;
  pagesRetrieved: number;
};

export type IssuerRetrievalResult =
  | ({ status: "success" } & IssuerFilingRetrieval)
  | ({ status: "partial"; errors: string[] } & IssuerFilingRetrieval)
  | { status: "failed"; query: string; queryUrl: string; filings: []; totalRecords: 0; pagesRetrieved: 0; errors: string[] };
