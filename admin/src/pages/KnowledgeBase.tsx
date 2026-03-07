import { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, FileText, Trash2, FileUp } from 'lucide-react';
import { api, type Document } from '../api/client';

export function KnowledgeBase() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: bot } = useQuery({
    queryKey: ['bot', id],
    queryFn: () => api.bots.get(id!),
    enabled: !!id,
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => api.documents.list(id!),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.documents.upload(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.documents.delete(id!, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => uploadMutation.mutate(f));
  }, [uploadMutation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => uploadMutation.mutate(f));
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Bots
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">Knowledge Base</h1>
      <p className="text-sm text-muted-foreground mb-6">{bot?.name} &mdash; Upload documents for the bot to reference</p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors mb-6"
      >
        <FileUp className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag &amp; drop files here, or{' '}
          <label className="text-primary font-medium cursor-pointer hover:underline">
            browse
            <input type="file" accept=".pdf,.txt,.md,.markdown" multiple onChange={handleFileSelect} className="hidden" />
          </label>
        </p>
        <p className="text-xs text-muted-foreground/70">Supports PDF, TXT, MD files</p>
        {uploadMutation.isPending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Uploading &amp; embedding...
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" /></div>
      ) : documents && documents.length > 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
          {documents.map((doc: Document) => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">{doc.chunk_count} chunks &middot; {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc.id); }}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        </div>
      )}
    </div>
  );
}
