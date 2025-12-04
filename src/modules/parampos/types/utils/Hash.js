import crypto from "crypto";
import iconv from "iconv-lite";

class Hash {
  constructor() {
    this.hash = null;
  }

  SHA2B64(hash) {
    const result = crypto
      .createHash("sha1")
      .update(iconv.encode(hash, "ISO-8859-9"))
      .digest()
      .toString("base64");
    return (this.hash = result);
  }
}

export default new Hash();
