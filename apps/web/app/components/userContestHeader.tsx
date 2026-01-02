export default function UserContestHeader() {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
                <p className="text-muted-foreground mt-2 text-base">
                    Browse active and past contests to test your skills.
                </p>
            </div>
        </div>
    );
}
