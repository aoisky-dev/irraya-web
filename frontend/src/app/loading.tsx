export default function Loading() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      padding: "var(--space-2xl)"
    }}>
      <div className="spinner" style={{ 
        width: "40px", 
        height: "40px", 
        borderWidth: "3px", 
        borderColor: "var(--accent) transparent transparent transparent" 
      }}></div>
      <p style={{ 
        marginTop: "var(--space-md)", 
        color: "var(--text-secondary)", 
        fontSize: "0.9rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase"
      }}>
        Loading
      </p>
    </div>
  );
}
