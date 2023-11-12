import MainLayout from '../src/components/MainLayout';
import AddressBook from '../src/components/Addressbook/AddressBook';
import InvoiceBook from '../src/components/Invoicebook/InvoiceBook';
const Home: React.FC = () => {
    return (
        <MainLayout>
            <AddressBook />
            <InvoiceBook />
        </MainLayout>
    );
}

export default Home;
