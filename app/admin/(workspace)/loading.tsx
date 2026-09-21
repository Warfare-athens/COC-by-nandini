export default function AdminWorkspaceLoading() {
  return <div className="admin-loading-page" role="status" aria-label="Loading admin page">
    <div className="admin-loading-header"><span /><span /></div>
    <div className="admin-loading-stats">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
    <div className="admin-loading-panel"><span /><span /><span /><span /></div>
  </div>;
}
