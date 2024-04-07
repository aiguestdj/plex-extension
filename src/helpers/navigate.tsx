import Router from 'next/router';

export function navigate(e: React.MouseEvent, path?: string) {
    if (!path)
        return;

    // const router = useRouter();
    if (e.ctrlKey || e.metaKey) {
        // window.open(path, "_blank")
    } else {

        e.preventDefault();
        e.stopPropagation()
        if (Router.asPath != path)
            Router.push(path);
    }
}