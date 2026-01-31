const pinRes = await fetch("https://api.pinata.cloud/v3/files/public/pin_by_cid", {
      method: "POST",
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlOWZhMzJlOS1iMDZmLTRmNzktODc4Mi02NmFjMDY3NmZhMWIiLCJlbWFpbCI6ImNvbmNpZXJnZUBhY3RpdmV3b3JsZGNsdWIubmV0IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImRmNDM5ZTU1MTQ5NmQ5NDY2M2FmIiwic2NvcGVkS2V5U2VjcmV0IjoiMGQzN2MwNDI3MmFmNWFiOGNhOTFjMGYyNTE5Zjc1ZmU0NjhmMGVhN2RhODg2OTNhMWRjMjBhMDVjYjE5MzE1MyIsImV4cCI6MTgwMTMwOTg4MX0.x0ieHVZZ9fjDY7aOA71bw3kYG5QkKzzGaTonRomm1Qs`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cid: "bafybeielsgzkrccaw2qguxonlblzhbjadeogtkyp7rhlfbp5f74pd2zgfe",
      }),
    });

const pinResJson = await pinRes.json();
console.log("Pinata Pin By Hash Response:");
console.log(pinResJson);
